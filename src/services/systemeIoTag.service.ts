import { axiosInstanceSysteme } from "../api/apiClient";

type SystemeTag = { id: string; name: string };
type SystemeContact = { id: string; tags?: SystemeTag[] };

async function listAllTags(): Promise<SystemeTag[]> {
  const res = await axiosInstanceSysteme.get("/tags?limit=100");
  return res.data?.items ?? [];
}

async function getContact(contactId: string): Promise<SystemeContact> {
  const res = await axiosInstanceSysteme.get(`/contacts/${contactId}`);
  return res.data;
}

async function resolveTagIds(
  tagNames: string[]
): Promise<Record<string, string>> {
  const tags = await listAllTags();
  const map: Record<string, string> = {};
  for (const name of tagNames) {
    const found = tags.find((t) => t.name === name);
    if (found) map[name] = found.id;
  }
  return map;
}

async function addTagsIfMissing(
  contactId: string,
  tagIds: string[]
): Promise<void> {
  console.log("!tagIds.length->>>>", tagIds.length);
  console.log("addTagsIfMissing - tagIds", tagIds);

  if (!tagIds.length) return;
  for (const tagId of tagIds) {
    await axiosInstanceSysteme.post(`/contacts/${contactId}/tags`, { tagId });
  }
}

export async function removeTagIfPresent(
  contactId: string,
  tagId: string
): Promise<void> {
  await axiosInstanceSysteme.delete(`/contacts/${contactId}/tags/${tagId}`);
}

export async function handleCancelImmediate(params: {
  contactId: string;
  addAppInitiatedTagName: string; // "CanceledHolisticMembershipAppInitiated"
}): Promise<void> {
  console.log("handleCancelImmediate", params);

  const { contactId, addAppInitiatedTagName } = params;
  const tagMap = await resolveTagIds([addAppInitiatedTagName]);
  const contact = await getContact(contactId);
  const currentTagIds = new Set((contact.tags ?? []).map((t) => t.id));

  const appInitId = tagMap[addAppInitiatedTagName];
  if (appInitId && !currentTagIds.has(appInitId)) {
    await addTagsIfMissing(contactId, [appInitId]);
  }
}

export async function handleExpiry(params: {
  contactId: string;
  removeEnrolledTagNames: string[]; // ["Enrolled_Holistic Membership", "Enrolled_to_Membership", "monthly_app_subscription", "yearly_app_subscription"]
  addOnExpiryTagNames: string[]; // ["Canceled Holistic Membership", "Canceled Holistic Membership App"]
}): Promise<void> {
  console.log("handleExpiry", params);
  const { contactId, addOnExpiryTagNames, removeEnrolledTagNames } = params;
  const tagMap = await resolveTagIds([
    ...removeEnrolledTagNames,
    ...addOnExpiryTagNames,
  ]);
  const contact = await getContact(contactId);
  const currentTagIds = new Set((contact.tags ?? []).map((t) => t.id));

  for (const name of removeEnrolledTagNames) {
    const enrolledId = tagMap[name];
    if (enrolledId && currentTagIds.has(enrolledId)) {
      await removeTagIfPresent(contactId, enrolledId);
    }
  }

  const toAddIds = addOnExpiryTagNames
    .map((n) => tagMap[n])
    .filter((id): id is string => !!id && !currentTagIds.has(id));

  if (toAddIds.length) {
    await addTagsIfMissing(contactId, toAddIds);
  }
}
