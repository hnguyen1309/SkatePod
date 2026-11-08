package com.skatepod.api.program;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** An element marker placed on the rink map, e.g. "2S" at a spot. key is the app's own id for it. */
@Embeddable
public class ProgramPlacement {

    @Column(name = "placement_key", nullable = false, length = 40)
    private String key;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false)
    private double x;

    @Column(nullable = false)
    private double y;

    protected ProgramPlacement() {
        // Required by JPA.
    }

    public ProgramPlacement(String key, String code, double x, double y) {
        this.key = key;
        this.code = code;
        this.x = x;
        this.y = y;
    }

    public String getKey() {
        return key;
    }

    public String getCode() {
        return code;
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }
}
