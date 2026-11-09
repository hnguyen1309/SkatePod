package com.skatepod.api.note;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * When the training history was last brought up to date. History entries are only added for lessons
 * that start after this, so an entry the coach deleted doesn't come back. There's only one row (id 1).
 */
@Entity
@Table(name = "history_check")
public class HistoryCheck {

    static final int ONLY_ROW = 1;

    @Id
    private Integer id;

    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;

    protected HistoryCheck() {
        // Required by JPA.
    }

    public HistoryCheck(Instant checkedAt) {
        this.id = ONLY_ROW;
        this.checkedAt = checkedAt;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(Instant checkedAt) {
        this.checkedAt = checkedAt;
    }
}
