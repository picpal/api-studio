package com.example.apitest.repository;

import com.example.apitest.entity.UiTestScript;
import com.example.apitest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UiTestScriptRepository extends JpaRepository<UiTestScript, Long> {

    List<UiTestScript> findByFolderId(Long folderId);

    List<UiTestScript> findByFolderIdOrderByNameAsc(Long folderId);

    List<UiTestScript> findByCreatedByOrderByCreatedAtDesc(User createdBy);

    @Query("SELECT s FROM UiTestScript s WHERE s.name LIKE %:keyword% OR s.description LIKE %:keyword%")
    List<UiTestScript> findByKeyword(@Param("keyword") String keyword);

    @Query("SELECT s FROM UiTestScript s WHERE s.folder.id = :folderId AND (s.name LIKE %:keyword% OR s.description LIKE %:keyword%)")
    List<UiTestScript> findByFolderIdAndKeyword(@Param("folderId") Long folderId, @Param("keyword") String keyword);

    boolean existsByNameAndFolderId(String name, Long folderId);

    long countByFolderId(Long folderId);

    long countByCreatedBy(User createdBy);
}