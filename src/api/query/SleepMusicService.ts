import { axiosInstance } from "../apiClient";
import { API_ENDPOINT } from "../ApiEndPoint";
import { useMutation, useQuery } from "@tanstack/react-query";
import {  AddFavoritesPayload, GetSleepMusicByCategoryPayload, GetSleepMusicPreviewPayload } from "../ApiPayloadType";

export const useGetSleepMusicByCategory = () => {
  return useMutation({
    mutationFn: async (payload: GetSleepMusicByCategoryPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_SLEEP_MUSIC_BY_CATEGORY + payload?.categoryId,
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


export const useGetSleepMusicByCategoryFavorites = () => {
  return useMutation({
    mutationFn: async (payload: GetSleepMusicByCategoryPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_SLEEP_MUSIC_BY_FAVORITES + payload?.categoryId,
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


export const useAddFavorites = () => {
  return useMutation({
    mutationFn: async (payload: AddFavoritesPayload) => {
      const response = await axiosInstance.put(
        API_ENDPOINT.ADD_FAVORITES + payload?.musicId,{},
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


export const useGetCategories = () => {
  return useQuery({
    queryKey: ["useGetCategories"],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINT.GET_CATEGORY);
      return response.data;
    },
  });
};


export const useGetSleepMusicPreview = () => {
  return useMutation({
    mutationFn: async (payload: GetSleepMusicPreviewPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_PREVIEW_MUSICS + payload?.categoryId,
      );
      return response.data;
    },
  });
};
