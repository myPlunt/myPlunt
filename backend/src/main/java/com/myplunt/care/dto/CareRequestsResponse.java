package com.myplunt.care.dto;

import java.util.List;

public record CareRequestsResponse(List<CareRequestResponse> received, List<CareRequestResponse> sent) {
}
