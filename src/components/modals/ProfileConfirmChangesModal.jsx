import React from "react";
import { ModalDialog } from "@openedx/paragon";
import Button from "../buttons/Button";
import subsMessages from "../profile/SubscriptionsManager/subscriptionsMessages";

const ProfileConfirmChangesModal = ({
  intl,
  isOpen,
  onClose,
  onConfirm,
  currentTotal,
  changesMoney,
  currentCourses,
  changesCourses,
}) => {
  const hasMoneyChanges = Number(changesMoney) !== 0;
  const hasCoursesChanges = Number(changesCourses) !== 0;

  const newTotal = hasMoneyChanges
    ? (Number(currentTotal) || 0) + (Number(changesMoney) || 0)
    : 0;

  const newCourses = hasCoursesChanges
    ? (Number(currentCourses) || 0) + (Number(changesCourses) || 0)
    : 0;

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={intl.formatMessage({
        id: "profile.confirm.changes.title",
        defaultMessage: "Confirm the following changes",
      })}
    >
      <ModalDialog.Body>
        <div style={{ marginBottom: 20}}>
          <h4
            style={{
              marginTop: "3rem",
              marginBottom: "2rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {intl.formatMessage({
              id: "profile.confirm.changes.subtitle",
              defaultMessage: "You are about to apply the following changes:",
            })}
          </h4>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          {/* Columna izquierda: cursos */}
          <div style={{ color: "#6b7280" }}>
            <div>
              {intl.formatMessage(
                subsMessages.summaryCurrentCourses || {
                  id: "subs.summary.currentCourses",
                  defaultMessage: "Current courses",
                }
              )}
              : <strong>{currentCourses}</strong>
            </div>
            <div>
              {intl.formatMessage(
                subsMessages.summaryChanges || {
                  id: "subs.summary.changes",
                  defaultMessage: "Changes",
                }
              )}
              : <strong>{`${
                changesCourses >= 0 ? "+" : ""
              }${changesCourses}`}</strong>
            </div>
            <div>
              {intl.formatMessage(
                subsMessages.summaryNewCourses || {
                  id: "subs.summary.newCourses",
                  defaultMessage: "New courses",
                }
              )}
              : <strong>{newCourses}</strong>
            </div>
          </div>

          {/* Columna derecha: montos */}
          <div style={{ color: "#6b7280" }}>
            <div>
              {intl.formatMessage(
                subsMessages.summaryCurrentTotal || {
                  id: "subs.summary.currentTotal",
                  defaultMessage: "Current total",
                }
              )}
              : <strong>{`USD $${currentTotal}`}</strong>
            </div>
            <div>
              {intl.formatMessage(
                subsMessages.summaryChanges || {
                  id: "subs.summary.changes",
                  defaultMessage: "Changes",
                }
              )}
              : <strong>{`${
                changesMoney >= 0 ? "+" : ""
              }USD $${changesMoney}`}</strong>
            </div>
            <div>
              {intl.formatMessage(
                subsMessages.summaryNewTotal || {
                  id: "subs.summary.newTotal",
                  defaultMessage: "New total",
                }
              )}
              : <strong>{`USD $${newTotal}`}</strong>
            </div>
          </div>
        </div>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <Button
          variant="primary"
          onClick={onConfirm}
          style={{ padding: "6px 12px", fontSize: "0.9rem" }}
        >
          {intl.formatMessage(
            subsMessages.modalConfirm || {
              id: "subs.modal.confirm",
              defaultMessage: "Confirm",
            }
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          style={{ marginLeft: 12, padding: "6px 12px", fontSize: "0.9rem" }}
        >
          {intl.formatMessage({
            id: "profile.confirm.changes.cancel",
            defaultMessage: "Cancel",
          })}
        </Button>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default ProfileConfirmChangesModal;
