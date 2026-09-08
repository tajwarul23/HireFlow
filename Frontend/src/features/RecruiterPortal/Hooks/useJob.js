import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createJobApi,
  deleteJobApi,
  generateJobDescriptionApi,
  getJobFeedApi,
  getCompanyJobFeedApi,
  updateJobApi,
} from "../Services/Job.api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../Auth/auth.context";
// import { useNavigate } from "react-router-dom";
// const navigate = useNavigate();
//-----------------QUERIES------------------------------
export const useGetCompanyJobFeed = () => {
  const {user} = useContext(AuthContext);
  return useInfiniteQuery({
    queryFn: ({ pageParam = 1 }) => getCompanyJobFeedApi({ page: pageParam }),
    queryKey: ["companyJobFeed", user?.company],
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.data?.pagination?.hasNextPage
        ? lastPage.data.pagination.currentPage + 1
        : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.company
  });
};

export const useGetJobFeed = (filters = {}) =>{
  return useInfiniteQuery({
    queryKey:["jobFeed", filters],
    queryFn: ({pageParam}) => getJobFeedApi({pageParam, filters}),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.data?.hasMore ? lastPage.data.nextCursor : undefined
  })
}

//-----------------MUTATIONS------------------------------
export const useCreateJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {user} = useContext(AuthContext);
  return useMutation({
    mutationFn: createJobApi,
    onSuccess: (data) => {
      toast.success("Job Posted Successfully")
      console.log(data);
      
      queryClient.invalidateQueries({
        queryKey: ["companyJobFeed", user?.company],
        
        
      });
      queryClient.invalidateQueries({
        queryKey: ["candidateJobFeed"],
      });
      
      navigate("/recruiter/jobFeed");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create job")
      console.error(error?.response?.data?.message || "Failed to create job");
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  const {user} = useContext(AuthContext);
  return useMutation({
    mutationFn: ({ jobId, data }) => updateJobApi(jobId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyJobFeed", user?.company],
      });

      toast.success("Job Updated Successfully")

      queryClient.invalidateQueries({
        queryKey: ["candidateJobFeed"],
      });
    },
    onError: (error) => {
      console.error(error?.response?.data?.message || "Failed to Update job");
      toast.error(error?.response?.data?.message || "Failed to update job")
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  const {user} = useContext(AuthContext);
  return useMutation({
    mutationFn : deleteJobApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyJobFeed", user?.company],
      });

      queryClient.invalidateQueries({
        queryKey: ["candidateJobFeed"],
      });
      toast.success("Job Deleted Successfully")
    },
    onError: (error) => {
      console.error(error?.response?.data?.message || "Failed to delete job");
      toast.error("Job Deletion Failed. Please Try later")
    },
  });
};

export const useGenerateJobDescription = () => {
  return useMutation({
    mutationFn: generateJobDescriptionApi,

    onError: (error) => {
      console.error(
        error?.response?.data?.message || "Failed to generate job description"
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to generate job description. Please try again."
      );
    },
  });
};
