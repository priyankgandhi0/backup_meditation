import { useMutation } from "@tanstack/react-query";
import { API_ENDPOINT } from "../ApiEndPoint";
import { axiosInstance } from "../apiClient";
import { GetGuidedMeditationPayload } from "../ApiPayloadType";

export const useGetGuidedMeditation = () => {
  return useMutation({
    mutationFn: async (payload: GetGuidedMeditationPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_GUIDED_MEDITATION +
          `page=${payload?.page}&limit=${payload?.limit}&email=${payload.email}`,
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
