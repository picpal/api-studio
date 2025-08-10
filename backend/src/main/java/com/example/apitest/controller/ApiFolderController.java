package com.example.apitest.controller;

import com.example.apitest.entity.ApiFolder;
import com.example.apitest.repository.ApiFolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@CrossOrigin(origins = "http://localhost:3000")
public class ApiFolderController {

    @Autowired
    private ApiFolderRepository folderRepository;

    @GetMapping
    public List<ApiFolder> getAllFolders() {
        return folderRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiFolder> getFolder(@PathVariable Long id) {
        return folderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ApiFolder createFolder(@RequestBody ApiFolder folder) {
        return folderRepository.save(folder);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiFolder> updateFolder(@PathVariable Long id, @RequestBody ApiFolder folderDetails) {
        return folderRepository.findById(id)
            .map(folder -> {
                if (folderDetails.getName() != null) {
                    folder.setName(folderDetails.getName());
                }
                folder.setExpanded(folderDetails.isExpanded());
                return ResponseEntity.ok(folderRepository.save(folder));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFolder(@PathVariable Long id) {
        return folderRepository.findById(id)
            .map(folder -> {
                folderRepository.delete(folder);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}