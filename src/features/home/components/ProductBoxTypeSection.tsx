import type { BoxType } from "../schemas/home.schema";
import { formatShelfLifeRecommendationText } from "../utils/shelfLifeText";

export function boxTypeKey(box: BoxType): string {
    return `${box.boxType}-${box.weight}`;
}

type Props = {
    /** Dùng cho dòng mở đầu card (thay cho tiêu đề "Chọn loại hộp"). */
    shelfLifeDays: number;
    boxTypes: BoxType[];
    selectedBox: BoxType | null;
    onSelect: (box: BoxType) => void;
};

/**
 * Chọn loại hộp — gọn, ít viền/đổ bóng để dễ nhìn lâu.
 */
export default function ProductBoxTypeSection({ shelfLifeDays, boxTypes, selectedBox, onSelect }: Props) {
    const shelfLine = formatShelfLifeRecommendationText(shelfLifeDays);

    if (boxTypes.length === 0) {
        return (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
                <p className="text-sm font-medium leading-snug text-slate-800">{shelfLine}</p>
                <p className="mt-2 text-sm text-slate-600">Hiện chưa có loại hộp nào để bán cho sản phẩm này.</p>
            </div>
        );
    }

    return (
        <div className="mt-6 rounded-lg border border-slate-200/90 bg-white p-4">
            <p className="text-sm font-medium leading-snug text-slate-800">{shelfLine}</p>
            <p className="mt-1.5 text-xs text-slate-500">Chọn loại hộp.</p>

            <div className="mt-3 flex flex-col gap-2">
                {boxTypes.map((box) => {
                    const key = boxTypeKey(box);
                    const isSelected = selectedBox ? boxTypeKey(selectedBox) === key : false;
                    const boxLabel = box.boxType === "Partial" ? "Hộp lẻ" : "Hộp đầy";
                    const disabled = box.availableCount <= 0;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelect(box)}
                            disabled={disabled}
                            className={[
                                "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                                disabled
                                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                                    : isSelected
                                      ? "border-[#1a5f2a] bg-[#f7faf7]"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
                            ].join(" ")}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p
                                        className={`text-sm font-medium ${disabled ? "text-slate-400" : "text-slate-900"}`}
                                    >
                                        {boxLabel}{" "}
                                        <span className="font-normal text-slate-600 tabular-nums">
                                            · {box.weight} kg
                                        </span>
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Còn{" "}
                                        <span className="tabular-nums font-medium text-slate-700">
                                            {box.availableCount}
                                        </span>{" "}
                                        hộp
                                        {disabled ? (
                                            <span className="text-slate-400"> · Tạm hết</span>
                                        ) : null}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-xs text-slate-500">Giá / hộp</p>
                                    <p className="text-sm font-semibold tabular-nums text-[#1a5f2a]">
                                        {box.boxPrice.toLocaleString("vi-VN")} ₫
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
