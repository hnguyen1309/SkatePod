package com.skatepod.api.student;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, UUID> {

    List<Student> findAllByOrderByNameAsc();
}
