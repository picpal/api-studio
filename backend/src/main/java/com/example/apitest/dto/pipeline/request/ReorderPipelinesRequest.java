package com.example.apitest.dto.pipeline.request;

import java.util.List;

public class ReorderPipelinesRequest {
    private Long folderId;
    private List<PipelineOrderItem> pipelines;

    public ReorderPipelinesRequest() {}

    public static class PipelineOrderItem {
        private Long pipelineId;
        private Integer orderIndex;

        public PipelineOrderItem() {}

        public Long getPipelineId() {
            return pipelineId;
        }

        public void setPipelineId(Long pipelineId) {
            this.pipelineId = pipelineId;
        }

        public Integer getOrderIndex() {
            return orderIndex;
        }

        public void setOrderIndex(Integer orderIndex) {
            this.orderIndex = orderIndex;
        }
    }

    public Long getFolderId() {
        return folderId;
    }

    public void setFolderId(Long folderId) {
        this.folderId = folderId;
    }

    public List<PipelineOrderItem> getPipelines() {
        return pipelines;
    }

    public void setPipelines(List<PipelineOrderItem> pipelines) {
        this.pipelines = pipelines;
    }
}
