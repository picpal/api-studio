import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { PlaywrightGuide } from '../PlaywrightGuide';

describe('PlaywrightGuide', () => {
  describe('rendering', () => {
    it('should render the component', () => {
      // Arrange & Act
      render(<PlaywrightGuide />);

      // Assert
      const guideElement = screen.getByTestId('playwright-guide');
      expect(guideElement).toBeInTheDocument();
    });

    it('should display the guide title text in Korean', () => {
      // Arrange & Act
      render(<PlaywrightGuide />);

      // Assert
      expect(screen.getByText('테스트 파일 생성 방법')).toBeInTheDocument();
    });

    it('should display the codegen command text', () => {
      // Arrange & Act
      render(<PlaywrightGuide />);

      // Assert
      const expectedCommand = 'npx playwright codegen --target playwright-test -o ./test.spec.js http://localhost:3010';
      expect(screen.getByText(expectedCommand)).toBeInTheDocument();
    });

    it('should display the copy button in Korean', () => {
      // Arrange & Act
      render(<PlaywrightGuide />);

      // Assert
      const copyButton = screen.getByTestId('copy-codegen-command');
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent('복사');
    });

    it('should display caution list', () => {
      // Arrange & Act
      render(<PlaywrightGuide />);

      // Assert
      const cautionList = screen.getByTestId('playwright-cautions');
      expect(cautionList).toBeInTheDocument();
      expect(screen.getByText('Playwright가 설치되어 있어야 합니다 (npm init playwright@latest)')).toBeInTheDocument();
      expect(screen.getByText('--target playwright-test 옵션은 필수입니다 (Playwright Test 형식)')).toBeInTheDocument();
      expect(screen.getByText('출력 파일명은 변경 가능하지만 .spec.js 확장자를 유지하세요')).toBeInTheDocument();
      expect(screen.getByText('마지막 URL은 테스트 대상 사이트 주소로 변경하세요')).toBeInTheDocument();
    });

    it('should always be visible without any toggle mechanism', () => {
      // Arrange & Act
      const { container } = render(<PlaywrightGuide />);

      // Assert - the guide element should be visible and not hidden
      const guideElement = screen.getByTestId('playwright-guide');
      expect(guideElement).toBeVisible();
      // No toggle buttons or show/hide controls should exist
      expect(container.querySelector('[data-testid="toggle-guide"]')).toBeNull();
    });
  });

  describe('copy button', () => {
    const expectedCommand = 'npx playwright codegen --target playwright-test -o ./test.spec.js http://localhost:3010';

    beforeEach(() => {
      // Mock navigator.clipboard.writeText
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('should call navigator.clipboard.writeText with the codegen command when copy button is clicked', async () => {
      // Arrange
      render(<PlaywrightGuide />);
      const copyButton = screen.getByTestId('copy-codegen-command');

      // Act
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedCommand);
    });

    it('should display Korean copied message after copy button is clicked', async () => {
      // Arrange
      render(<PlaywrightGuide />);
      const copyButton = screen.getByTestId('copy-codegen-command');

      // Act
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Assert
      const successMessage = screen.getByTestId('copy-success-message');
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveTextContent('복사되었습니다!');
    });

    it('should hide "Copied!" text after 3 seconds', async () => {
      // Arrange
      vi.useFakeTimers();
      render(<PlaywrightGuide />);
      const copyButton = screen.getByTestId('copy-codegen-command');

      // Act - click copy button
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Assert - "Copied!" is visible
      expect(screen.getByTestId('copy-success-message')).toBeInTheDocument();

      // Act - advance timer by 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Assert - "Copied!" should be gone
      expect(screen.queryByTestId('copy-success-message')).toBeNull();
    });
  });
});
