import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance, axiosInstanceSysteme } from "../apiClient";
import { API_ENDPOINT } from "../ApiEndPoint";
import {
  CreateContactsPayload,
  DeleteContactsPayload,
  DeleteUserPayload,
  ForgotPasswordPayload,
  GetContactIdPayload,
  GetUserTagPayload,
  LoginPayload,
  RegisterPayload,
  TagSetContactsIdPayload,
  UserTagSystemeIoPayload,
} from "../ApiPayloadType";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await axiosInstance.post(API_ENDPOINT.LOGIN, payload);
      return response.data;
    },
  });
};

export const useGetContactId = () => {
  return useMutation({
    mutationFn: async (payload: GetContactIdPayload) => {
      const response = await axiosInstanceSysteme.get(
        API_ENDPOINT.CONTACTS_EMAIL + `${payload?.email}&limit=100`
      );
      return response.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await axiosInstance.post(API_ENDPOINT.REGISTER, payload);
      return response.data;
    },
  });
};

export const useCreateContacts = () => {
  return useMutation({
    mutationFn: async (payload: CreateContactsPayload) => {
      const response = await axiosInstanceSysteme.post(
        API_ENDPOINT.CONTACTS,
        payload
      );
      return response.data;
    },
  });
};

export const useGetTag = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstanceSysteme.get(API_ENDPOINT.GET_TAG);
      return response.data;
    },
  });
};

export const useTagSetContactsId = () => {
  return useMutation({
    mutationFn: async (payload: TagSetContactsIdPayload) => {
      const response = await axiosInstanceSysteme.post(
        API_ENDPOINT.CONTACTS + `/${payload?.contactId}/tags`,
        payload
      );
      return response.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      const response = await axiosInstance.post(
        API_ENDPOINT.FORGOT_PASSWORD,
        payload
      );
      return response.data;
    },
  });
};


export const useDeleteContacts = () => {
  return useMutation({
    mutationFn: async (payload: DeleteContactsPayload) => {
      const response = await axiosInstanceSysteme.delete(
        API_ENDPOINT.DELETE_CONTACTS + payload?.contactsId
      );
      return response.data;
    },
  });
};

export const useDeleteUser= () => {
  return useMutation({
    mutationFn: async (payload: DeleteUserPayload) => {
      const response = await axiosInstance.delete(
        API_ENDPOINT.DELETE_USER,
        {
          headers: {
            ssid: payload?.token,
          },
        }
      );
      return response.data;
    },
  });
};

export const useUserTagSystemeIo = () => {
  return useMutation({
    mutationFn: async (payload: UserTagSystemeIoPayload) => {
      const response = await axiosInstanceSysteme.get(
        API_ENDPOINT.CONTACTS + '/' +payload?.contactsId
      );
      return response.data?.tags.map((tag: { name: string }) => tag.name);
    },
  });
};

