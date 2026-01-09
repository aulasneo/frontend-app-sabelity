import React from "react";
import { ModalDialog } from "@openedx/paragon";

/**
 * Modal reutilizable para bloquear el downgrade de plan cuando
 * el número de cursos en uso supera al nuevo límite.
 *
 * Se parametrizan solo los IDs de i18n para no duplicar JSX.
 */
const DowngradeBlockedModal = ({
  intl,
  isOpen,
  onClose,
  titleId,
  messageId,
  closeId,
  planLimit,
  coursesInUse,
  messageDefault,
}) => (
  <ModalDialog
    isOpen={isOpen}
    onClose={onClose}
    title={intl.formatMessage({
      id: titleId,
      defaultMessage: "You cannot downgrade your plan",
    })}
  >
    <ModalDialog.Body>
      <div className="subs-downgrade-blocked">
        <p className="subs-downgrade-main-text">
          {intl.formatMessage({
            id: messageId,
            defaultMessage:
              messageDefault ||
              "You currently have more courses created than the selected plan allows. Please delete some courses before downgrading your subscription.",
          })}
        </p>

        {planLimit != null && coursesInUse != null && (
          <p className="subs-downgrade-details">
            {intl.formatMessage(
              {
                id: "downgrade.blocked.details",
                defaultMessage:
                  "Your current plan allows {planLimit} courses and you currently have {coursesInUse} courses created.",
              },
              {
                planLimit,
                coursesInUse,
              }
            )}
          </p>
        )}
      </div>
    </ModalDialog.Body>
    <ModalDialog.Footer>
      <button
        type="button"
        className="subs-btn"
        onClick={onClose}
      >
        {intl.formatMessage({
          id: closeId,
          defaultMessage: "Close",
        })}
      </button>
    </ModalDialog.Footer>
  </ModalDialog>
);

export default DowngradeBlockedModal;
