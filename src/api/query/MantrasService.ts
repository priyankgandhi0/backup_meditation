import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../apiClient";
import { API_ENDPOINT } from "../ApiEndPoint";
import { GetMantraPayload } from "../ApiPayloadType";

export const useGetMantra = () => {
  return useMutation({
    mutationFn: async (payload: GetMantraPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_MANTRA +
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
