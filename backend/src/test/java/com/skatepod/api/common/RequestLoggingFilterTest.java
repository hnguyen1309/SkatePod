package com.skatepod.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class RequestLoggingFilterTest {

    private final RequestLoggingFilter filter = new RequestLoggingFilter();

    @Test
    void describesMethodPathStatusAndTime() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/students");

        assertThat(RequestLoggingFilter.describe(request, 201, 14)).isEqualTo("POST /api/students → 201 (14 ms)");
    }

    @Test
    void includesTheQuery() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/lessons");
        request.setQueryString("studentId=abc");

        assertThat(RequestLoggingFilter.describe(request, 200, 6)).isEqualTo("GET /api/lessons?studentId=abc → 200 (6 ms)");
    }

    @Test
    void onlyApiCallsAreLogged() {
        assertThat(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/api/students"))).isFalse();
        assertThat(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/favicon.ico"))).isTrue();
    }
}
