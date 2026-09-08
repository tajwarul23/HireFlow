import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzePrepApi, applyToJobApi, getAllApplicationForCompanyApi, updateApplicationStatusApi } from "../Services/application.api.js";
import { useContext } from "react";
import { AuthContext } from "../../Auth/auth.context";
import toast from "react-hot-toast";


export const useGetAllApplicationForCompany = (filters = {}) => {
  const {user} = useContext(AuthContext);
  const company = user?.company
  return useInfiniteQuery({
    queryKey: ["companyApplications", company, filters],

    queryFn: ({ pageParam = 1 }) =>
      getAllApplicationForCompanyApi({ ...filters, page: pageParam }),

    initialPageParam: 1,

    getNextPageParam: (lastPage) =>
      lastPage?.data?.pagination?.hasNextPage
        ? lastPage.data.pagination.currentPage + 1
        : undefined,

    enabled: !!filters.job && !!company,

    staleTime: 60 * 1000,

    refetchInterval: (query) => {
      const pages = query.state.data?.pages ?? [];
      const applications = pages.flatMap((p) => p?.data?.applications ?? []);

      const isGenerating = applications.some(
        (application) => application.recruiterReportStatus === "generating",
      );

      return isGenerating ? 3000 : false;
    },
  });
};

export const useUpdateApplicationStatus = () =>{
  const queryClient = useQueryClient();
  const {user} = useContext(AuthContext);
  const company = user?.company;

  return useMutation({
    mutationFn: ({applicationId, status, interviewLink, interviewDate, interviewTime}) =>
      updateApplicationStatusApi(applicationId, status, { interviewLink, interviewDate, interviewTime }),

    onSuccess: ()=>{
      queryClient.invalidateQueries({
        queryKey: ["companyApplications",company]
      })

      toast.success("Application Status updated")
    },

    onError: (error)=>{
      toast.error(error?.response?.data?.message || "Failed to update application status")
    }
  })
}

export const useApplyToJob = () =>{
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn:applyToJobApi,

    onSuccess: () =>{
      toast.success("Applied to job successfully");

      queryClient.invalidateQueries({
        queryKey: ["companyApplications"]
      });

      queryClient.invalidateQueries({
        queryKey:["jobFeed"]
      })
    },

    onError: (error)=>{
      toast.error(error?.response?.data?.message || "Failed to apply for this job")
    }
  })
}

export const useAnalyzePrep = () =>{
  return useMutation({
    mutationFn:analyzePrepApi,

    onError: (error)=>{
      toast.error(error?.response?.data?.message || "Failed to generate interview prep report")
    }
  })
}