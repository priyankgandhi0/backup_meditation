import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../apiClient";
import { API_ENDPOINT } from "../ApiEndPoint";
import { useMutation } from "@tanstack/react-query";

export const useGetThemes = () => {
  return useQuery({
    queryKey: ["useGetThemes"],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINT.GET_THEMES);
      return response.data;
    },
  });
};
