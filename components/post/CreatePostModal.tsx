"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * @file CreatePostModal.tsx
 * @description Instagram 스타일의 게시물 작성 모달
 *
 * 주요 기능:
 * - 이미지 업로드 (최대 5MB, jpeg/png/webp)
 * - 캡션 입력 (최대 2,200자)
 * - 미리보기 표시
 * - Supabase Storage 업로드
 * - 업로드 진행 상태 표시
 *
 * @dependencies
 * - shadcn/ui Dialog, Button, Textarea
 * - lucide-react: 아이콘
 * - next/navigation: 라우터
 */

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAPTION_LENGTH = 2200;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CreatePostModal({
  open,
  onOpenChange,
}: CreatePostModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 파일 선택 핸들러
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 형식 검증
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("JPEG, PNG, WEBP 이미지만 업로드 가능합니다.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // 이미지 압축 옵션
      const options = {
        maxSizeMB: 5, // 최대 파일 크기 5MB
        maxWidthOrHeight: 1920, // 최대 너비/높이
        useWebWorker: true, // 백그라운드 처리로 UI 블로킹 방지
        fileType: file.type, // 원본 파일 타입 유지
      };

      console.log(`원본 이미지 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // 이미지 압축
      const compressedFile = await imageCompression(file, options);

      console.log(`압축 후 크기: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      // 압축 후에도 5MB를 초과하면 에러
      if (compressedFile.size > MAX_FILE_SIZE) {
        setError("이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.");
        return;
      }

      setSelectedFile(compressedFile);

      // 미리보기 생성
      const url = URL.createObjectURL(compressedFile);
      setPreviewUrl(url);
    } catch (err) {
      console.error("이미지 처리 오류:", err);
      setError("이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 파일 제거
  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 모달 닫기
  const handleClose = () => {
    if (isUploading || isProcessing) return; // 업로드 또는 처리 중에는 닫기 방지

    // 상태 초기화
    handleRemoveFile();
    setCaption("");
    setError(null);
    onOpenChange(false);
  };

  // 게시물 업로드
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("caption", caption);

      console.log("업로드 시작...");
      
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        // 응답 텍스트 먼저 확인
        const responseText = await response.text();
        console.error("Response text:", responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          console.error("Upload error data:", errorData);
          throw new Error(errorData.error || "게시물 업로드에 실패했습니다.");
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          throw new Error(`서버 오류 (${response.status}): ${responseText || '알 수 없는 오류'}`);
        }
      }

      // 성공: 모달 닫고 피드 새로고침
      handleClose();
      router.refresh();
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "게시물 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 이미지 업로드 영역 */}
          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-16 h-16 text-[#0095f6] animate-spin" />
                    <p className="text-lg font-semibold text-gray-700">
                      이미지 처리 중...
                    </p>
                    <p className="text-xs text-gray-500">
                      최적의 크기로 자동 조정하고 있습니다
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                    <div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">
                        사진을 여기에 끌어다 놓으세요
                      </p>
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#0095f6] hover:bg-[#0095f6]/90"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        컴퓨터에서 선택
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, WEBP (자동으로 5MB 이하로 최적화됩니다)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 이미지 미리보기 */}
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="미리보기"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  aria-label="이미지 제거"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 캡션 입력 */}
              <div className="space-y-2">
                <Textarea
                  placeholder="캡션을 입력하세요..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                  className="min-h-[100px] resize-none text-gray-900"
                  disabled={isUploading}
                />
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    {caption.length}/{MAX_CAPTION_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading || isProcessing}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isProcessing}
              className="bg-[#0095f6] hover:bg-[#0095f6]/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                "공유"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

