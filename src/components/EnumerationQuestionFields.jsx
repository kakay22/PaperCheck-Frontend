
import { Plus, Trash2 } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function EnumerationQuestionFields({
  form,
  updateField,
  updateKeyItem,
}) {
  const count = Math.max(
    0,
    Number.parseInt(form.enum_item_count, 10) || 0,
  );

  const perItem = Math.max(
    0,
    Number(form.enum_points_per_item) || 0,
  );

  const totalPoints = count * perItem;

  function changeItemCount(value) {
    const nextCount = Math.min(
      100,
      Math.max(1, Number.parseInt(value, 10) || 1),
    );

    updateField("enum_item_count", String(nextCount));

    const existing = form.key_items || [];

    const nextItems = Array.from(
      { length: nextCount },
      (_, index) => {
        const existingItem = existing.find(
          (item) => Number(item.position) === index + 1,
        );

        return (
          existingItem || {
            position: index + 1,
            variants_text: "",
          }
        );
      },
    );

    updateField("key_items", nextItems);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="enum-item-count"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Number of items
          </label>

          <input
            id="enum-item-count"
            type="number"
            min="1"
            max="100"
            step="1"
            value={form.enum_item_count ?? 3}
            onChange={(event) =>
              changeItemCount(event.target.value)
            }
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="enum-points-per-item"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Points per item
          </label>

          <input
            id="enum-points-per-item"
            type="number"
            min="0.01"
            step="0.01"
            value={form.enum_points_per_item ?? "1.00"}
            onChange={(event) =>
              updateField(
                "enum_points_per_item",
                event.target.value,
              )
            }
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Total question points
          </p>
          <p className="mt-1 text-xs text-blue-700">
            {count} items × {perItem.toFixed(2)} points
          </p>
        </div>

        <span className="text-xl font-bold tabular-nums text-blue-800">
          {totalPoints.toFixed(2)}
        </span>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50">
        <input
          type="checkbox"
          checked={Boolean(form.enum_ordered)}
          onChange={(event) =>
            updateField("enum_ordered", event.target.checked)
          }
          className="mt-0.5 size-4 accent-blue-600"
        />

        <span>
          <span className="block text-sm font-medium text-slate-800">
            Require answers in order
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Enable this when the answers must follow a specific sequence.
          </span>
        </span>
      </label>

      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Answer key
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Enter acceptable answers for each item. Separate alternative
            answers with commas.
          </p>
        </div>

        <div className="space-y-3">
          {Array.from({ length: count }, (_, index) => {
            const position = index + 1;
            const item = (form.key_items || []).find(
              (entry) => Number(entry.position) === position,
            );

            return (
              <div
                key={position}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {position}
                </span>

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`enum-answer-${position}`}
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    Item {position} accepted answers
                  </label>

                  <input
                    id={`enum-answer-${position}`}
                    value={item?.variants_text ?? ""}
                    onChange={(event) =>
                      updateKeyItem(position, event.target.value)
                    }
                    placeholder="e.g. Solar energy, sunlight"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
