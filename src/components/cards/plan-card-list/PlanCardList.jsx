import React from "react";
import PlanCard from "../PlanCard";
import "./plans.css";

const PlanCardList = ({ plans = [], currentPlan = null, onPlanSelect }) => {
  return (
    <div className="contentCards">
      {plans.map((plan) => {
        const title = plan.title?.defaultMessage || plan.title;
        const description = plan.description?.defaultMessage || plan.description;
        const price = plan.price?.defaultMessage || plan.price;
        return (
          <PlanCard
            key={plan.id}
            title={title}
            description={description}
            price={price}
            className={`card-${plan.id} ${plan.id === "standard" ? "card-standard" : ""}`}
            onPlanSelect={() => onPlanSelect(plan)}
            isPopular={plan.isPopular}
            isDisabled={!!currentPlan && plan.id === currentPlan.id}
          />
        );
      })}
    </div>
  );
};

export default PlanCardList;
