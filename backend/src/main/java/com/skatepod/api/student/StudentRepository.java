package com.skatepod.api.student;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, UUID> {

    /** Loads each student's disciplines in the same query, instead of one extra query per student. */
    @EntityGraph(attributePaths = "disciplines")
    List<Student> findAllByOrderByNameAsc();
}
