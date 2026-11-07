package com.skatepod.api.program;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** One point of a line drawn on the rink map. pathIndex says which line (0 = the first one drawn). */
@Embeddable
public class ProgramPathPoint {

    @Column(name = "path_index", nullable = false)
    private int pathIndex;

    @Column(nullable = false)
    private double x;

    @Column(nullable = false)
    private double y;

    protected ProgramPathPoint() {
        // Required by JPA.
    }

    public ProgramPathPoint(int pathIndex, double x, double y) {
        this.pathIndex = pathIndex;
        this.x = x;
        this.y = y;
    }

    public int getPathIndex() {
        return pathIndex;
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }
}
