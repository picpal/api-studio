package com.example.apitest.repository;

import com.example.apitest.entity.ApiItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiItemRepository extends JpaRepository<ApiItem, Long> {
    @Query("SELECT i FROM ApiItem i WHERE i.folder.id = :folderId")
    List<ApiItem> findByFolderId(@Param("folderId") Long folderId);
}