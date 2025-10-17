package com.example.apitest.repository;

import com.example.apitest.entity.UiTestFile;
import com.example.apitest.entity.UiTestScript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UiTestFileRepository extends JpaRepository<UiTestFile, Long> {

    List<UiTestFile> findByScriptOrderByUploadedAtDesc(UiTestScript script);

    List<UiTestFile> findByScript_IdOrderByUploadedAtDesc(Long scriptId);

    void deleteByScript(UiTestScript script);

    long countByScript(UiTestScript script);
}
