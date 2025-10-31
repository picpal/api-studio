package com.example.apitest.service;

import com.example.apitest.entity.UiTestFolder;
import com.example.apitest.entity.User;
import com.example.apitest.repository.UiTestFolderRepository;
import com.example.apitest.repository.UiTestScriptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UiTestFolderService {

    @Autowired
    private UiTestFolderRepository folderRepository;

    @Autowired
    private UiTestScriptRepository scriptRepository;

    public List<Map<String, Object>> getAllFolders() {
        List<UiTestFolder> folders = folderRepository.findAll();
        return folders.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRootFolders() {
        List<UiTestFolder> folders = folderRepository.findByParentIsNullOrderByNameAsc();
        return folders.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getChildFolders(Long parentId) {
        List<UiTestFolder> folders = folderRepository.findByParentIdOrderByNameAsc(parentId);
        return folders.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public Optional<Map<String, Object>> getFolder(Long id) {
        return folderRepository.findById(id)
                .map(this::convertToMap);
    }

    public List<Map<String, Object>> getFolderStructure() {
        List<UiTestFolder> rootFolders = folderRepository.findByParentIsNullOrderByNameAsc();
        return rootFolders.stream()
                .map(this::convertToMapWithChildren)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createFolder(Map<String, Object> folderData, User createdBy) {
        UiTestFolder folder = new UiTestFolder();
        folder.setName((String) folderData.get("name"));
        folder.setDescription((String) folderData.get("description"));
        folder.setCreatedBy(createdBy);

        Object parentIdObj = folderData.get("parentId");
        if (parentIdObj != null) {
            Long parentId = Long.valueOf(parentIdObj.toString());
            Optional<UiTestFolder> parent = folderRepository.findById(parentId);
            parent.ifPresent(folder::setParent);
        }

        UiTestFolder savedFolder = folderRepository.save(folder);
        return convertToMap(savedFolder);
    }

    @Transactional
    public Optional<Map<String, Object>> updateFolder(Long id, Map<String, Object> folderDetails) {
        return folderRepository.findById(id)
                .map(folder -> {
                    if (folderDetails.containsKey("name")) {
                        folder.setName((String) folderDetails.get("name"));
                    }
                    if (folderDetails.containsKey("description")) {
                        folder.setDescription((String) folderDetails.get("description"));
                    }
                    if (folderDetails.containsKey("parentId")) {
                        Object parentIdObj = folderDetails.get("parentId");
                        if (parentIdObj != null) {
                            Long parentId = Long.valueOf(parentIdObj.toString());
                            Optional<UiTestFolder> parent = folderRepository.findById(parentId);
                            parent.ifPresent(folder::setParent);
                        } else {
                            folder.setParent(null);
                        }
                    }

                    UiTestFolder updatedFolder = folderRepository.save(folder);
                    return convertToMap(updatedFolder);
                });
    }

    @Transactional
    public boolean deleteFolder(Long id) {
        if (folderRepository.existsById(id)) {
            Optional<UiTestFolder> folderOpt = folderRepository.findById(id);
            if (folderOpt.isPresent()) {
                UiTestFolder folder = folderOpt.get();

                long scriptCount = folderRepository.countScriptsByFolderId(id);
                long subFolderCount = folderRepository.countChildFoldersByParentId(id);

                if (scriptCount > 0 || subFolderCount > 0) {
                    throw new RuntimeException("Cannot delete folder that contains scripts or subfolders");
                }
            }

            folderRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean existsByNameAndParent(String name, Long parentId) {
        if (parentId == null) {
            return folderRepository.existsByNameAndParentIsNull(name);
        } else {
            return folderRepository.existsByNameAndParentId(name, parentId);
        }
    }

    private Map<String, Object> convertToMap(UiTestFolder folder) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", folder.getId());
        map.put("name", folder.getName());
        map.put("description", folder.getDescription());
        map.put("createdAt", folder.getCreatedAt());
        map.put("updatedAt", folder.getUpdatedAt());

        if (folder.getParent() != null) {
            map.put("parentId", folder.getParent().getId());
            map.put("parentName", folder.getParent().getName());
        }

        if (folder.getCreatedBy() != null) {
            map.put("createdBy", folder.getCreatedBy().getEmail());
        }

        long scriptCount = folderRepository.countScriptsByFolderId(folder.getId());
        long subFolderCount = folderRepository.countChildFoldersByParentId(folder.getId());
        map.put("scriptCount", scriptCount);
        map.put("subFolderCount", subFolderCount);

        return map;
    }

    private Map<String, Object> convertToMapWithChildren(UiTestFolder folder) {
        Map<String, Object> map = convertToMap(folder);

        List<UiTestFolder> children = folderRepository.findByParentIdOrderByNameAsc(folder.getId());
        List<Map<String, Object>> childrenMaps = children.stream()
                .map(this::convertToMapWithChildren)
                .collect(Collectors.toList());
        map.put("children", childrenMaps);

        return map;
    }
}