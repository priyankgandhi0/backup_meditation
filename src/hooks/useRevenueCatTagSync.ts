// useRevenueCatTagSync.ts
import { useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import Purchases from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  handleCancelImmediate,
  handleExpiry,
} from "@/src/services/systemeIoTag.service";
import { useAppDispatch } from "../redux/StateType";
import { fullAccessMemberTags, limitedAccessTags } from "../utils/accessRules";
import { authActions } from "../redux/slice/AuthSlice";
import { useUserTagSystemeIo } from "../api/query/AuthService";

type Params = {
  contactId?: string;
  membershipStatus?: string;
};

// Global maps to prevent duplicates across all hook instances
const contactCooldownMap: Map<string, number> = new Map();
const processingMap: Map<string, boolean> = new Map();

export function useRevenueCatTagSync({ contactId, membershipStatus }: Params) {
  // Store params in ref to avoid stale closures
  const paramsRef = useRef({ contactId, membershipStatus });
  const isInitializedRef = useRef(false);

  const dispatch = useAppDispatch();
  const userTagSystemeIo = useUserTagSystemeIo();

  // Update params ref whenever they change
  paramsRef.current = { contactId, membershipStatus };

  // ✅ FIXED: Find canceled but still active subscription (the one we care about)
  const findActiveCanceledSubscription = (items: any[]) => {
    let activeCanceled: any = null;
    let mostRecentTimestamp = 0;

    for (const item of items) {
      const unsubscribeDetectedAt = item.unsubscribeDetectedAt;
      const isActive = item.isActive === true;
      const expiresDateStr = item.expiresDate || item.expirationDate;

      // ✅ KEY CHANGE: Only consider items that are:
      // 1. Currently active (not expired)
      // 2. Have been canceled (unsubscribeDetectedAt exists)
      // 3. Not set to renew (willRenew is false)
      if (unsubscribeDetectedAt && isActive && !item.willRenew) {
        const expiresDate = new Date(expiresDateStr).getTime();
        const currentTime = Date.now();

        // Double check it's actually still active (not expired)
        if (expiresDate > currentTime) {
          const timestamp = new Date(unsubscribeDetectedAt).getTime();
          if (timestamp > mostRecentTimestamp) {
            mostRecentTimestamp = timestamp;
            activeCanceled = {
              item,
              timestamp,
              unsubscribeDetectedAt,
            };
          }
        }
      }
    }

    console.log(
      "🔍 Active canceled subscription found:",
      activeCanceled
        ? {
            productId: activeCanceled.item.productIdentifier,
            unsubscribeDetectedAt: activeCanceled.unsubscribeDetectedAt,
            isActive: activeCanceled.item.isActive,
            willRenew: activeCanceled.item.willRenew,
            expiresDate:
              activeCanceled.item.expiresDate ||
              activeCanceled.item.expirationDate,
          }
        : "None"
    );

    return activeCanceled;
  };

  // Main processing function
  const processSubscriptionStatus = useCallback(async () => {
    const {
      contactId: currentContactId,
      membershipStatus: currentMembershipStatus,
    } = paramsRef.current;

    console.log("🔄 processSubscriptionStatus called", {
      contactId: currentContactId,
      membershipStatus: currentMembershipStatus,
    });

    if (!currentContactId) {
      console.log("❌ No contactId, skipping");
      return;
    }
    if (currentMembershipStatus !== "Premium Membership") {
      console.log("❌ Not premium member, skipping");
      return;
    }

    // Global cooldown per contact
    const cooldownKey = currentContactId;
    const last = contactCooldownMap.get(cooldownKey) || 0;
    const now = Date.now();
    if (now - last < 5000) {
      console.log("⏳ Cooldown active, skipping");
      return;
    }

    // Processing lock per contact
    const processingKey = `processing_${currentContactId}`;
    if (processingMap.get(processingKey)) {
      console.log("🔒 Already processing, skipping");
      return;
    }

    contactCooldownMap.set(cooldownKey, now);
    processingMap.set(processingKey, true);

    try {
      console.log("✅ Starting subscription processing");
      const customerInfo: any = await Purchases.getCustomerInfo();
      console.log("customerInfo ->>", JSON.stringify(customerInfo));

      // Build product map
      const byProduct: Record<string, any> = {};
      const subs =
        customerInfo?.subscriptionsByProductIdentifier ||
        customerInfo?.subscriptions ||
        {};
      Object.keys(subs).forEach((key) => {
        const s = (subs as any)[key];
        const id = s?.productIdentifier || key;
        if (id) {
          byProduct[id] = {
            ...s,
            productIdentifier: id,
            source: "subscription",
          };
        }
      });

      const ents = customerInfo?.entitlements?.all || {};
      Object.keys(ents).forEach((key) => {
        const e = (ents as any)[key];
        const id = e?.productIdentifier || key;
        if (byProduct[id]) {
          byProduct[id] = { ...byProduct[id], ...e, productIdentifier: id };
        } else {
          byProduct[id] = {
            ...e,
            productIdentifier: id,
            source: "entitlement",
          };
        }
      });

      const items = Object.values(byProduct);
      if (!items.length) {
        console.log("📭 No subscription items found");
        return;
      }

      // ✅ FIXED: Find active canceled subscription (not expired old ones)
      const activeCanceledSubscription = findActiveCanceledSubscription(items);

      // Process each item
      for (const item of items) {
        await processSubscriptionItem(
          item,
          currentContactId,
          activeCanceledSubscription
        );
      }

      console.log("✅ Subscription processing completed");
    } catch (err) {
      console.log("❌ processSubscriptionStatus error", err);
    } finally {
      processingMap.delete(processingKey);
    }
  }, []);

  // Process individual subscription item
  const processSubscriptionItem = async (
    item: any,
    contactId: string,
    activeCanceledSubscription: any
  ) => {
    const willRenew = item.willRenew === true;
    const isActive = item.isActive === true;
    const expiresDateStr: string | undefined =
      item.expiresDate || item.expirationDate;
    const unsubscribeDetectedAt: string | undefined =
      item.unsubscribeDetectedAt;
    const pid: string = item.productIdentifier || "unknown";

    // ✅ FIXED: Only handle cancellation for active canceled subscriptions
    if (unsubscribeDetectedAt && isActive && !willRenew) {
      const isThisActiveCanceled =
        activeCanceledSubscription &&
        activeCanceledSubscription.item.productIdentifier === pid &&
        activeCanceledSubscription.unsubscribeDetectedAt ===
          unsubscribeDetectedAt;

      if (isThisActiveCanceled) {
        console.log(`🎯 Processing active cancellation for ${pid}`);
        await handleCancellation(contactId, pid, unsubscribeDetectedAt);
      } else {
        console.log(`⏭️ Skipping non-active cancellation for ${pid}`);
      }
    }

    // Handle expiry (only for inactive/expired subscriptions)
    if (expiresDateStr && !isActive) {
      await handleExpiryLogic(contactId, pid, expiresDateStr, willRenew);
    }
  };

  const handleCancellation = async (
    contactId: string,
    pid: string,
    unsubscribeDetectedAt: string
  ) => {
    const cancelTimestamp = new Date(unsubscribeDetectedAt).getTime();
    const cancelKey = `rc_tag_cancel_${contactId}_${pid}_${cancelTimestamp}`;

    try {
      const already = await AsyncStorage.getItem(cancelKey);
      if (!already) {
        console.log(`🚫 Processing cancellation for ${pid}`);

        await handleCancelImmediate({
          contactId,
          addAppInitiatedTagName: "CanceledHolisticMembershipAppInitiated",
        });

        await AsyncStorage.setItem(cancelKey, "1");

        console.log(`✅ Cancellation processed for ${pid}`);
      } else {
        console.log(`⏭️ Cancellation already processed for ${pid}`);
      }
    } catch (err) {
      console.log("❌ handleCancelImmediate error", err);
    }
  };

  const handleExpiryLogic = async (
    contactId: string,
    pid: string,
    expiresDateStr: string,
    willRenew: boolean
  ) => {
    const expTs = new Date(expiresDateStr).getTime();
    const expiryKey = `rc_tag_expiry_${contactId}_${pid}_${expTs}`;

    if (Date.now() >= expTs && !willRenew) {
      try {
        const alreadyExp = await AsyncStorage.getItem(expiryKey);
        if (!alreadyExp) {
          console.log(`⏰ Processing expiry for ${pid}`);

          const subscriptionType =
            pid === "rcm_1m"
              ? "monthly_app_subscription"
              : "yearly_app_subscription";

          await handleExpiry({
            contactId,
            removeEnrolledTagNames: [
              "Enrolled_Holistic Membership",
              "Enrolled_to_Membership",
              subscriptionType,
            ],
            addOnExpiryTagNames: [
              "CanceledHolisticMembershipAppInitiated",
              "Canceled Holistic Membership",
              "Canceled Holistic Membership App",
            ],
          });

          await AsyncStorage.setItem(expiryKey, "1");
          const userResTag = await userTagSystemeIo.mutateAsync({
            contactsId: contactId,
          });
          console.log("userResTag", JSON.stringify(userResTag));

          const userHasFullAccess = userResTag?.some((tag: string) =>
            fullAccessMemberTags.includes(tag)
          );
          const userHasLimitedAccess = userResTag?.some((tag: string) =>
            limitedAccessTags.includes(tag)
          );
          if (userHasFullAccess) {
            dispatch(authActions.setMembershipStatus("Premium Membership"));
          } else if (userHasLimitedAccess) {
            dispatch(authActions.setMembershipStatus("Limited Access"));
          } else {
            dispatch(authActions.setMembershipStatus("Basic Membership"));
          }
          console.log(`✅ Expiry processed for ${pid}`);
        } else {
          console.log(`⏭️ Expiry already processed for ${pid}`);
        }
      } catch (err) {
        console.log("❌ handleExpiry error", err);
      }
    } else {
      console.log(`⏳ Subscription ${pid} not expired or will renew`);
    }
  };

  // App state change handler
  const handleAppStateChange = useCallback((state: AppStateStatus) => {
    console.log("📱 App state changed to:", state);
    if (state === "active") {
      console.log("🚀 App became active, processing after delay");
      setTimeout(() => {
        processSubscriptionStatus();
      }, 1000);
    }
  }, []);

  // Set up app state listener
  useEffect(() => {
    console.log("🔧 Setting up RevenueCat tag sync");
    isInitializedRef.current = true;

    processSubscriptionStatus();

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      console.log("🧹 Cleaning up RevenueCat tag sync");
      subscription.remove();

      if (paramsRef.current.contactId) {
        processingMap.delete(`processing_${paramsRef.current.contactId}`);
      }
      isInitializedRef.current = false;
    };
  }, []);

  // Handle parameter changes
  const prevParamsRef = useRef({ contactId, membershipStatus });
  useEffect(() => {
    const prevParams = prevParamsRef.current;
    const currentParams = { contactId, membershipStatus };

    if (
      isInitializedRef.current &&
      (prevParams.contactId !== currentParams.contactId ||
        prevParams.membershipStatus !== currentParams.membershipStatus)
    ) {
      console.log("📝 Params changed:", {
        from: prevParams,
        to: currentParams,
      });
      const timeoutId = setTimeout(() => {
        processSubscriptionStatus();
      }, 200);
      prevParamsRef.current = currentParams;
      return () => clearTimeout(timeoutId);
    } else {
      prevParamsRef.current = currentParams;
    }
  }, [contactId, membershipStatus]);

  return {
    manualSync: processSubscriptionStatus,
  };
}
