import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
} from "react-native";
import { hp, wp } from "../../helper/Responsive";
import { colors } from "@/src/utils/colors";
import { CategoryModalProps, CategoryType } from "@/src/interface/Types";
import { useGetCategories } from "@/src/api/query/SleepMusicService";
import Modal from "react-native-modal";

export const CategoryModal = ({
  isVisible,
  onClose,
  onSelectCategory,
  selectedCategory,
}: CategoryModalProps) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const getCategories = useGetCategories();

  useEffect(() => {
    if (isVisible && getCategories.data) {
      setCategories(
        getCategories.data.filter(
          (item: { type: string }) => item.type === "music"
        )
      );
    }
  }, [isVisible, getCategories.data]);

  const handleCategoryPress = (category: CategoryType) => {
    onSelectCategory(category);
    onClose();
  };

  const renderCategoryItem = ({ item }: { item: CategoryType }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?._id === item._id && styles.selectedCategory,
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.1}
      style={{ margin: 0, justifyContent: "flex-end" }}
      statusBarTranslucent
      animationIn={"slideInUp"}
      animationOut={"slideOutDown"}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>SELECT CATEGORY</Text>
        {getCategories.isPending ? (
          <ActivityIndicator size="large" color={colors.dark_mauve_2} />
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
            />
          </View>
        )}
        <Pressable onPress={() => onClose()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: wp(100),
    height: hp(50),
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderRadius: 10,
    padding: wp(5),
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: colors.light_white_1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: hp(2),
    color: colors.black,
  },
  categoryItem: {
    width: wp(60),
    padding: wp(4),
    backgroundColor: colors.primary,
    borderRadius: 15,
    marginBottom: hp(1),
    alignItems: "center",
    alignSelf: "center",
  },
  selectedCategory: {
    borderColor: colors.green,
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 16,
    color: colors.white,
  },
  closeButton: {
    padding: wp(4),
    backgroundColor: colors.primary,
    borderRadius: 15,
    alignItems: "center",
    width: wp(60),
    alignSelf: "center",
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
  },
});
