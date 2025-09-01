package com.example.apitest.dto.pipeline.request;

import java.util.List;

public class BatchUpdateStepOrderRequest {
    private List<StepOrderItem> steps;

    public BatchUpdateStepOrderRequest() {}

    public List<StepOrderItem> getSteps() { return steps; }
    public void setSteps(List<StepOrderItem> steps) { this.steps = steps; }

    public static class StepOrderItem {
        private Long stepId;
        private Integer newOrder;

        public StepOrderItem() {}

        public Long getStepId() { return stepId; }
        public void setStepId(Long stepId) { this.stepId = stepId; }

        public Integer getNewOrder() { return newOrder; }
        public void setNewOrder(Integer newOrder) { this.newOrder = newOrder; }
    }
}