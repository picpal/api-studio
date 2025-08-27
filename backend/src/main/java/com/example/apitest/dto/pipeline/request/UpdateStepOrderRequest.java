package com.example.apitest.dto.pipeline.request;

public class UpdateStepOrderRequest {
    private Integer newOrder;

    public UpdateStepOrderRequest() {}

    public Integer getNewOrder() { return newOrder; }
    public void setNewOrder(Integer newOrder) { this.newOrder = newOrder; }
}