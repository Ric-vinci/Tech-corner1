import {
  FAULTY_CONDITION_POINTS,
  FULLY_WORKING_CONDITION_POINTS,
  NO_POWER_CONDITION_POINTS,
} from "@/data/trade-in-conditions";

type Props = {
  condition: "Fully Working" | "Faulty" | "No Power" | "";
};

export default function ConditionDetails({ condition }: Props) {
  if (!condition) return null;

  const points =
    condition === "Fully Working"
      ? FULLY_WORKING_CONDITION_POINTS
      : condition === "Faulty"
        ? FAULTY_CONDITION_POINTS
        : NO_POWER_CONDITION_POINTS;

  return (
    <div className="text-left w-full my-4 pb-4 border-b border-grey-light px-1">
      <ul className="list-disc ml-4 text-sm text-grey-dark space-y-1">
        {points.map((point) => {
          if (typeof point === "string") {
            return <li key={point}>{point}</li>;
          }
          return (
            <li key={point.text}>
              {point.text}{" "}
              {point.help === "screen-burn" && (
                <button
                  type="button"
                  className="bg-blue rounded-full w-4 h-4 text-white text-xs ml-1 leading-4 align-middle"
                  aria-label="Screen burn help"
                  title="Screen burn is permanent discolouration or ghost images on the display."
                >
                  ?
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
