import { FileUpload } from "@ark-ui/react/file-upload";
import type { ReactNode } from "react";

import buttonStyles from "./button.module.css";
import { configVariant } from "./cx";
import fileUploadStyles from "./file-upload.module.css";
import { Icon } from "./icon";

export type FileFieldProps = {
  /** 項目名 */
  label: string;
  /** ドロップ領域の文言 */
  dropText?: string;
  /** ファイルを選ぶボタンの文言 */
  triggerLabel?: string;
  /** 補足（形式・大きさの上限など） */
  helperText?: ReactNode;
  /** 選んでいるファイル。親が持ち、取り込みが終わったら空にできる */
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** 複数のファイルを選べるか。選べる数の上限はmaxFiles */
  multiple?: boolean;
  maxFiles?: number;
  /** ファイルを選ぶ画面で絞り込む形式（例: application/json）。形式の確認はサーバーでも行う */
  accept?: string;
  /** 画像のプレビューを出す */
  preview?: boolean;
  disabled?: boolean;
};

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

// 「ファイルを選ぶ」ボタンはbuttonレシピのsecondary・smで作る（button.tsxと同じ組み立て方）
const triggerClassName = configVariant(buttonStyles, {
  variant: "secondary",
  size: "sm",
  fullWidth: false,
  spread: false,
  labelAlign: "center",
});

// ファイルを選ぶ欄。ドロップとファイルの選択、キーボード操作はArk UIのFileUploadが行う
export function FileField({
  label,
  dropText = "ここにドロップ",
  triggerLabel = "ファイルを選ぶ",
  helperText,
  files,
  onFilesChange,
  multiple = false,
  maxFiles = 1,
  accept,
  preview = false,
  disabled,
}: FileFieldProps) {
  return (
    <FileUpload.Root
      className={fileUploadStyles.root}
      acceptedFiles={files}
      onFileChange={(details) => onFilesChange(details.acceptedFiles)}
      maxFiles={multiple ? maxFiles : 1}
      accept={accept}
      disabled={disabled}
    >
      <FileUpload.Label className={fileUploadStyles.label}>{label}</FileUpload.Label>
      {/* 領域を押しても開かず、中の「ファイルを選ぶ」で開く（押せる要素を入れ子にしない） */}
      <FileUpload.Dropzone className={fileUploadStyles.dropzone} disableClick>
        <span className={fileUploadStyles.icon} aria-hidden="true">
          <Icon name="upload" size="lg" />
        </span>
        <p className={fileUploadStyles.dropText}>{dropText}</p>
        <FileUpload.Trigger className={triggerClassName}>
          <span data-part="label">{triggerLabel}</span>
        </FileUpload.Trigger>
      </FileUpload.Dropzone>
      {files.length ? (
        multiple ? (
          <p className={fileUploadStyles.summary} aria-live="polite">
            <Icon name="image" size="md" />
            {files.length}件を選択（{maxFiles}件まで）
          </p>
        ) : (
          <FileUpload.ItemGroup className={fileUploadStyles.list}>
            {files.map((file) => (
              <FileUpload.Item key={file.name} file={file} className={fileUploadStyles.item}>
                {preview ? (
                  <FileUpload.ItemPreview type="image/*">
                    <FileUpload.ItemPreviewImage className={fileUploadStyles.preview} />
                  </FileUpload.ItemPreview>
                ) : null}
                <FileUpload.ItemName className={fileUploadStyles.itemName} />
                <span className={fileUploadStyles.itemSize}>{formatSize(file.size)}</span>
              </FileUpload.Item>
            ))}
          </FileUpload.ItemGroup>
        )
      ) : null}
      {helperText ? <p className={fileUploadStyles.helperText}>{helperText}</p> : null}
      <FileUpload.HiddenInput />
    </FileUpload.Root>
  );
}
