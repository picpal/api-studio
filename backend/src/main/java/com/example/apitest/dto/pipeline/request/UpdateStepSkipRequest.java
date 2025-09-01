package com.example.apitest.dto.pipeline.request;

public class UpdateStepSkipRequest {
    private boolean skip;

    public UpdateStepSkipRequest() {}

    public UpdateStepSkipRequest(boolean skip) {
        this.skip = skip;
    }

    public boolean isSkip() {
        return skip;
    }

    public void setSkip(boolean skip) {
        this.skip = skip;
    }
}