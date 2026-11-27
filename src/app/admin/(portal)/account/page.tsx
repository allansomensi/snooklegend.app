"use client";

import { KeyRound, LogOut, Monitor, ShieldCheck, Smartphone } from "lucide-react";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { CodeField, RecoveryCodes } from "@/admin/components/security/two-step";
import { Badge, Btn, Card, CardHead, Empty, PageHead, TimeAgo, useRoleLabel } from "@/admin/components/ui/bits";
import { FormDialog } from "@/admin/components/ui/form-dialog";
import { Loaded } from "@/admin/components/ui/loaded";
import { Modal } from "@/admin/components/ui/modal";
import { api, seg, signOutHere } from "@/admin/lib/api";
import { useApi, useMe } from "@/admin/lib/hooks";
import { session } from "@/admin/lib/session";
import "@/admin/styles/security.css";

interface DeviceRow {
  id: string;
  label: string;
  created_at: number;
  last_used_at: number;
  expires_at: number;
}

interface Security {
  two_step_at: number | null;
  recovery_codes_left: number;
  devices: DeviceRow[];
  device_days: number;
}

/** The staff member's own account: two-step verification, recovery codes
 * and the devices kept signed in. */
export default function AccountPage() {
  const { t, tn, tf, fmtDate } = useLocale();
  const me = useMe();
  const roleLabel = useRoleLabel();
  const q = useApi<Security>("/security");
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const here = session.device()?.id || null;

  const newCodes = () =>
    dialogs.open((close) => (
      <FormDialog
        title={t("New recovery codes")}
        text={t("The codes you have now stop working. Type a code from your authenticator app to make ten new ones.")}
        icon={KeyRound}
        fields={[
          {
            type: "custom",
            name: "code",
            render: (v, set) => <CodeField id="new-codes-code" value={String(v)} onChange={(x) => set(x)} />,
          },
        ]}
        submit={t("Make new codes")}
        onSubmit={async (v) => {
          const d = await api<{ recovery_codes: string[] }>("/security/recovery-codes", { method: "POST", body: { code: String(v.code).trim() } });
          close();
          void q.refetch();
          dialogs.open((done) => (
            <Modal
              title={t("Your new recovery codes")}
              text={t("Keep them somewhere safe. Each one signs you in once if you lose your phone. They are not shown again.")}
              icon={ShieldCheck}
              onClose={done}
              footer={<Btn label={t("Done")} kind="primary" onClick={done} />}
            >
              <RecoveryCodes codes={d.recovery_codes} username={me.username} />
            </Modal>
          ));
        }}
        onClose={close}
      />
    ));

  const signOutDevice = async (d: DeviceRow) => {
    const ok = await dialogs.confirm({
      title: t("Sign this device out?"),
      text: d.id === here ? t("This device asks for your password and a code again.") : t("That device asks for the password and a code again."),
      confirm: t("Sign out"),
      tone: "danger",
      icon: LogOut,
    });
    if (!ok) return;
    if (d.id === here) {
      await signOutHere();
      return;
    }
    if (await attempt(() => api("/security/devices/" + seg(d.id), { method: "DELETE" }), t("Device signed out."))) void q.refetch();
  };

  const everywhere = async () => {
    const ok = await dialogs.confirm({
      title: t("Sign out everywhere?"),
      text: t("Every session and device of yours in the portal ends, this one too. The game stays signed in."),
      confirm: t("Sign out everywhere"),
      tone: "danger",
      icon: LogOut,
    });
    if (!ok) return;
    if (await attempt(() => api("/security/sign-out-everywhere", { method: "POST" }))) {
      session.forgetDevice();
      session.end(t("You signed out everywhere."));
    }
  };

  return (
    <Loaded queries={[q]}>
      {(s) => (
        <div>
          <PageHead title={t("Your account")} sub={me.username + " · " + roleLabel(me.role)} />
          <div className="security-grid">
            <Card>
              <CardHead title={t("Two-step verification")} sub={t("Required for moderators and administrators: your password and a code from an authenticator app.")} />
              <div className="card-body stack">
                <div className="security-row">
                  <div className="security-text">
                    <strong className="row">
                      <ShieldCheck className="icon" aria-hidden />
                      {s.two_step_at ? t("On") : t("Off")}
                    </strong>
                    {s.two_step_at ? <span>{tf("Since {date}", { date: fmtDate(s.two_step_at) })}</span> : null}
                  </div>
                </div>
                <div className="security-row">
                  <div className="security-text">
                    <strong>{t("Recovery codes")}</strong>
                    <span>
                      {s.recovery_codes_left === 0
                        ? t("None left: make new ones now.")
                        : tn(s.recovery_codes_left, "{n} left, each works once.", "{n} left, each works once.")}
                    </span>
                  </div>
                  <Btn label={t("Make new codes")} icon={KeyRound} kind={s.recovery_codes_left <= 3 ? "primary" : ""} onClick={newCodes} />
                </div>
                <p className="hint">{t("Lost your phone and your codes? An administrator can turn your two-step verification off; you set it up again when you sign in.")}</p>
              </div>
            </Card>

            <Card>
              <CardHead
                title={t("Devices kept signed in")}
                sub={tf("They stay signed in until {n} days without use. Choose “Keep me signed in on this device” when you sign in.", { n: s.device_days })}
              />
              <div className="card-body">
                {s.devices.length === 0 ? (
                  <Empty icon={Smartphone} title={t("No device kept signed in")} text={t("This tab signs out after 8 hours.")} />
                ) : (
                  <ul className="device-list">
                    {s.devices.map((d) => {
                      const phone = /Android|iPhone|iPad/.test(d.label);
                      const Icon = phone ? Smartphone : Monitor;
                      return (
                        <li key={d.id} className="device-row">
                          <span className="device-icon"><Icon className="icon" aria-hidden /></span>
                          <div className="device-main">
                            <span className="device-name">
                              {d.label}
                              {d.id === here ? <Badge kind="accent">{t("This device")}</Badge> : null}
                            </span>
                            <span className="device-meta">
                              {t("Last used")} <TimeAgo at={d.last_used_at} /> · {tf("signed in {date}", { date: fmtDate(d.created_at) })}
                            </span>
                          </div>
                          <Btn label={t("Sign out")} icon={LogOut} kind="ghost" onClick={() => void signOutDevice(d)} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>

            <Card>
              <div className="card-body">
                <div className="security-row">
                  <div className="security-text">
                    <strong>{t("Sign out everywhere")}</strong>
                    <span>{t("Lost a device, or signed in somewhere you shouldn't have? End every session of yours in the portal.")}</span>
                  </div>
                  <Btn label={t("Sign out everywhere")} icon={LogOut} kind="danger-soft" onClick={() => void everywhere()} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </Loaded>
  );
}
