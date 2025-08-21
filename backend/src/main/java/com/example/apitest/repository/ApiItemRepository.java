package com.example.apitest.repository;

import com.example.apitest.entity.ApiItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiItemRepository extends JpaRepository<ApiItem, Long> {
    @Query("SELECT i FROM ApiItem i WHERE i.folder.id = :folderId ORDER BY i.createdAt ASC")
    List<ApiItem> findByFolderIdOrderByCreatedAtAsc(@Param("folderId") Long folderId);
    
    @Modifying
    @Query("DELETE FROM ApiItem a WHERE a.id = :id")
    int deleteByIdCustom(@Param("id") Long id);
}