import { useMutation } from "@tanstack/react-query";
import { API_ENDPOINT } from "../ApiEndPoint";
import { axiosInstance } from "../apiClient";
import { GetChakraPayload } from "../ApiPayloadType";

export const useGetChakra = () => {
  return useMutation({
    mutationFn: async (payload: GetChakraPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_CHAKRA +
          `${
            payload.email
              ? `email=${payload?.email}&page=${payload?.page}&limit=${payload?.limit}`
              : `page=${payload?.page}&limit=${payload?.limit}`
          }`
      );
      return response.data;
    },
  });
};
