package com.skatepod.api.common;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * "What time is it now?" comes from this Clock bean instead of LocalDateTime.now(),
 * so tests can freeze time and check date logic like "next lesson".
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
