import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../apiClient";
import { API_ENDPOINT } from "../ApiEndPoint";
import {
  CoursesCompletePayload,
  GetCoursesPayload,
  GetCoursesSectionsPayload,
  GetMyProgressPayload,
  UpdateCoursesProgressPayload,
} from "../ApiPayloadType";

export const useGetCourses = () => {
  return useMutation({
    mutationFn: async (payload: GetCoursesPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_COURSES + payload?.email
      );
      return response.data;
    },
  });
};

export const useGetCoursesSections = () => {
  return useMutation({
    mutationFn: async (payload: GetCoursesSectionsPayload) => {
      console.log("🚀 ~ useGetCoursesSections ~ payload:", payload)
      const response = await axiosInstance.get(
        API_ENDPOINT.GET_COURSES_SECTIONS +
          `${payload.id}/sections?email=${payload?.email}`,
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

export const useUpdateCoursesProgress = () => {
  return useMutation({
    mutationFn: async (payload: UpdateCoursesProgressPayload) => {
      const response = await axiosInstance.patch(
        API_ENDPOINT.UPDATE_PROGRESS +
          `/${payload.coursesId}/sections/${payload.sectionsId}/lessons/${payload.lessonsId}/progress`,
          { watchTimeInSeconds: payload?.watchTimeInSeconds },
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

export const useCoursesComplete = () => {
  return useMutation({
    mutationFn: async (payload: CoursesCompletePayload) => {
      const response = await axiosInstance.post(
        API_ENDPOINT.UPDATE_PROGRESS +
          `/${payload.coursesId}/sections/${payload.sectionsId}/lessons/${payload.lessonsId}/complete`,
          {},
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

export const useGetMyProgress = () => {
  return useMutation({
    mutationFn: async (payload: GetMyProgressPayload) => {
      const response = await axiosInstance.get(
        API_ENDPOINT.MY_PROGRESS, {
          headers: {
            ssid: payload?.token,
          },
        }
      );
      return response.data;
    },
  });
};