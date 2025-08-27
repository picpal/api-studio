package com.example.apitest.service;

import com.example.apitest.entity.UserActivity;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelExportService {

    public void exportUserActivitiesToExcel(List<UserActivity> activities, OutputStream outputStream) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("사용자 활동 로그");
        
        // 헤더 스타일
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        // 헤더 생성
        Row headerRow = sheet.createRow(0);
        String[] headers = {"ID", "사용자 이메일", "활동 유형", "액션 설명", "요청 URI", 
                          "HTTP 메서드", "IP 주소", "결과", "오류 메시지", "생성 시간"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.autoSizeColumn(i);
        }
        
        // 데이터 행 생성
        int rowNum = 1;
        for (UserActivity activity : activities) {
            Row row = sheet.createRow(rowNum++);
            
            row.createCell(0).setCellValue(activity.getId());
            row.createCell(1).setCellValue(activity.getUserEmail());
            row.createCell(2).setCellValue(activity.getActivityType().toString());
            row.createCell(3).setCellValue(activity.getActionDescription());
            row.createCell(4).setCellValue(activity.getRequestUri());
            row.createCell(5).setCellValue(activity.getHttpMethod());
            row.createCell(6).setCellValue(activity.getIpAddress());
            row.createCell(7).setCellValue(activity.getResult().toString());
            row.createCell(8).setCellValue(activity.getErrorMessage());
            row.createCell(9).setCellValue(activity.getCreatedAt().toString());
        }
        
        // 열 너비 자동 조정
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
        
        // Excel 파일 출력
        workbook.write(outputStream);
        workbook.close();
    }

    public String generateFileName(String prefix) {
        return prefix + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
    }
}