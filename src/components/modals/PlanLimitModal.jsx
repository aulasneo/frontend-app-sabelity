import React from "react";
import { ModalDialog } from "@openedx/paragon";
import Button from "../../components/buttons/Button";

const PlanLimitModal = ({
  intl,
  messages,
  isOpen,
  onClose,
  coursesCount,
  planLimit,
  newPlanLimit,
  deleteCourses,
}) => {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={intl.formatMessage(messages.modalTitle)}
    >
      <ModalDialog.Body>
        <p className="alertMinPlan">
          {intl.formatMessage(messages.modalExceedsCourses, {
            currentCourses: coursesCount,
            newLimit: planLimit,
            limit: newPlanLimit,
          })}
        </p>
        <p className="alertMinPlan">
          {intl.formatMessage(messages.modalContent, {
            limit: newPlanLimit,
            deleteCourses: deleteCourses,
          })}
        </p>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <Button variant="primary" onClick={onClose}>
          {intl.formatMessage(messages.modalButtonClose)}
        </Button>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default PlanLimitModal;
