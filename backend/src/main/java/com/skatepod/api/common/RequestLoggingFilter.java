package com.skatepod.api.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Prints one line per API request in the backend terminal, so you can see the app's calls arrive:
 *
 *   POST /api/students → 201 (14 ms)
 *   GET /api/lessons?studentId=... → 200 (6 ms)
 *
 * Only the method, path, status and time are logged, never request bodies: they can hold
 * students' names and notes, and many skaters are minors.
 */
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long started = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            // In `finally`, so a request that fails with an error is logged too.
            long millis = (System.nanoTime() - started) / 1_000_000;
            log.info(describe(request, response.getStatus(), millis));
        }
    }

    /** Only calls to the API are logged (not e.g. a browser asking for /favicon.ico). */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api");
    }

    static String describe(HttpServletRequest request, int status, long millis) {
        String query = request.getQueryString();
        String path = request.getRequestURI() + (query == null ? "" : "?" + query);
        return request.getMethod() + " " + path + " → " + status + " (" + millis + " ms)";
    }
}
