import { account } from "@/lib/appwrite";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppwriteException } from "appwrite";
import { useNavigate } from "react-router-dom";

const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) {
      return null;
    }
    throw error;
  }
};

export const useUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      if (error instanceof AppwriteException && error.code === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await account.deleteSession("current");
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      navigate("/");
    },
  });
};
