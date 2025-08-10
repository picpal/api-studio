package com.example.apitest.repository;

import com.example.apitest.entity.ApiFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiFolderRepository extends JpaRepository<ApiFolder, Long> {
}