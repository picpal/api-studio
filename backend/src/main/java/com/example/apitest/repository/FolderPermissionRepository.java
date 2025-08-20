package com.example.apitest.repository;

import com.example.apitest.entity.FolderPermission;
import com.example.apitest.entity.User;
import com.example.apitest.entity.ApiFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FolderPermissionRepository extends JpaRepository<FolderPermission, Long> {
    List<FolderPermission> findByUserId(Long userId);
    List<FolderPermission> findByFolderId(Long folderId);
    Optional<FolderPermission> findByUserAndFolder(User user, ApiFolder folder);
    boolean existsByUserIdAndFolderId(Long userId, Long folderId);
    
    @Modifying
    @Query("DELETE FROM FolderPermission p WHERE p.folder.id = :folderId")
    void deleteByFolderId(@Param("folderId") Long folderId);
}