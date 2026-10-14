package com.myplunt.common.logging;

import com.fasterxml.jackson.annotation.JsonProperty;

// The categories the app may log under. Debug lines stay on the device.
public enum ClientLogType {
    @JsonProperty("error") ERROR,
    @JsonProperty("warning") WARNING,
    @JsonProperty("action") ACTION,
    @JsonProperty("bug") BUG,
    @JsonProperty("info") INFO
}
