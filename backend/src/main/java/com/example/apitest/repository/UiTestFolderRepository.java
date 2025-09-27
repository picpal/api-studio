package com.example.apitest.repository;

import com.example.apitest.entity.UiTestFolder;
import com.example.apitest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UiTestFolderRepository extends JpaRepository<UiTestFolder, Long> {

    List<UiTestFolder> findByParentIsNullOrderByNameAsc();

    List<UiTestFolder> findByParentIdOrderByNameAsc(Long parentId);

    List<UiTestFolder> findByCreatedByOrderByCreatedAtDesc(User createdBy);

    @Query("SELECT f FROM UiTestFolder f WHERE f.name LIKE %:keyword% OR f.description LIKE %:keyword%")
    List<UiTestFolder> findByKeyword(@Param("keyword") String keyword);

    boolean existsByNameAndParentId(String name, Long parentId);

    boolean existsByNameAndParentIsNull(String name);

    @Query("SELECT COUNT(s) FROM UiTestScript s WHERE s.folder.id = :folderId")
    long countScriptsByFolderId(@Param("folderId") Long folderId);

    @Query("SELECT COUNT(f) FROM UiTestFolder f WHERE f.parent.id = :parentId")
    long countChildFoldersByParentId(@Param("parentId") Long parentId);

    // Recursive query for H2 - simplified version
    @Query("SELECT f FROM UiTestFolder f WHERE f.parent.id = :folderId")
    List<UiTestFolder> findAllSubFolders(@Param("folderId") Long folderId);
}