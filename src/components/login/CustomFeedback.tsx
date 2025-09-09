import { hp, wp } from '@/src/helper/Responsive';
import { CustomAlertProps } from '@/src/interface/Types';
import { colors } from '@/src/utils/colors';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';


export const CustomAlert = ({ visible, title, message, onClose }: CustomAlertProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}  
          >
            <Text style={styles.textStyle}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal:wp(5),
    backgroundColor: colors.black_900,
  },
  modalView: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: wp(8),
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: hp(2),
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalText: {
    marginBottom: hp(2),
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    padding: wp(3),
    elevation: 2,
    backgroundColor: colors.primary,
  },
  textStyle: {
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
