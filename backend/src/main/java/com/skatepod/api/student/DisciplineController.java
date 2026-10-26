package com.skatepod.api.student;

import com.skatepod.api.student.dto.DisciplineResponse;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The list of disciplines and their levels, so the app can fill its dropdowns. */
@RestController
@RequestMapping("/api/disciplines")
public class DisciplineController {

    @GetMapping
    public List<DisciplineResponse> list() {
        return Arrays.stream(Discipline.values()).map(DisciplineResponse::from).toList();
    }
}
