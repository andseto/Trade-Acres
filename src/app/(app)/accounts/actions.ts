"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { CROPS } from "@/lib/farm";
import type { AccountStatus, AccountType, CropId } from "@/lib/types";
import { parseMoney, type PlotFormState } from "@/components/accounts/form-types";

const TYPES: AccountType[] = ["eval", "funded", "personal"];
const STATUSES: AccountStatus[] = ["active", "passed", "blown", "retired"];
const MAX_MONEY = 1_000_000_000_000; // numeric(14,2)

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

type PlotPayload = {
  name: string;
  firm: string | null;
  account_type: AccountType;
  account_size: number | null;
  profit_target: number | null;
  max_drawdown: number | null;
  notes: string | null;
  crop: CropId;
  plot_name: string;
};

function parsePlotForm(fd: FormData): { data?: PlotPayload; state?: PlotFormState } {
  const errors: NonNullable<PlotFormState["errors"]> = {};

  const name = str(fd, "name");
  if (!name) errors.name = "Give the account a name, e.g. “Apex 50K #3”.";
  else if (name.length > 80) errors.name = "Keep it under 80 characters.";

  const firm = str(fd, "firm");
  if (firm.length > 60) errors.firm = "Firm name is a bit long (60 max).";

  const account_type = str(fd, "account_type") as AccountType;
  if (!TYPES.includes(account_type)) errors.account_type = "Pick eval, funded or personal.";

  const money = (key: "account_size" | "profit_target" | "max_drawdown", label: string) => {
    const v = parseMoney(str(fd, key));
    if (v === null) return null;
    if (Number.isNaN(v) || v < 0) {
      errors[key] = `${label} should be a positive number.`;
      return null;
    }
    if (v >= MAX_MONEY) {
      errors[key] = `${label} is… ambitious. Try something smaller.`;
      return null;
    }
    return v;
  };
  const account_size = money("account_size", "Account size");
  const profit_target = money("profit_target", "Profit target");
  const max_drawdown = money("max_drawdown", "Max drawdown");
  if (account_size === null && !errors.account_size) errors.account_size = "How big is the account?";
  else if (account_size === 0) errors.account_size = "Account size must be more than $0.";
  if (account_size && max_drawdown && max_drawdown > account_size)
    errors.max_drawdown = "Max drawdown can’t be bigger than the account.";

  const notes = str(fd, "notes");
  if (notes.length > 2000) errors.notes = "Notes are capped at 2,000 characters.";

  const crop = str(fd, "crop") as CropId;
  if (!CROPS.some((c) => c.id === crop)) errors.crop = "Pick a crop.";

  const plot_name = str(fd, "plot_name");
  if (!plot_name) errors.plot_name = "Every plot needs a name on its sign.";
  else if (plot_name.length > 40) errors.plot_name = "Keep the name under 40 characters.";

  if (Object.keys(errors).length) return { state: { errors, message: "A few things need fixing." } };

  return {
    data: {
      name,
      firm: firm || null,
      account_type,
      account_size,
      profit_target,
      max_drawdown,
      notes: notes || null,
      crop,
      plot_name,
    },
  };
}

function revalidatePlot(id?: string) {
  revalidatePath("/accounts");
  revalidatePath("/farm");
  if (id) revalidatePath(`/accounts/${id}`);
}

export async function createAccount(_prev: PlotFormState, formData: FormData): Promise<PlotFormState> {
  const parsed = parsePlotForm(formData);
  if (!parsed.data) return parsed.state!;

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("accounts")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) return { message: `Couldn’t plant your plot: ${error?.message ?? "unknown error"}` };

  revalidatePlot();
  redirect(`/farm?watered=${data.id}`);
}

export async function updateAccount(_prev: PlotFormState, formData: FormData): Promise<PlotFormState> {
  const id = str(formData, "id");
  if (!id) return { message: "Missing plot id." };
  const parsed = parsePlotForm(formData);
  if (!parsed.data) return parsed.state!;

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("accounts")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return { message: `Couldn’t save: ${error.message}` };
  if (!data) return { message: "That plot has gone missing (not found)." };

  revalidatePlot(id);
  redirect(`/accounts/${id}`);
}

export async function renamePlot(id: string, plotName: string): Promise<{ error?: string }> {
  const name = plotName.trim();
  if (!name) return { error: "Every plot needs a name on its sign." };
  if (name.length > 40) return { error: "Keep the name under 40 characters." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("accounts").update({ plot_name: name }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePlot(id);
  return {};
}

export async function setAccountStatus(id: string, status: AccountStatus): Promise<{ error?: string }> {
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("accounts").update({ status }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePlot(id);
  return {};
}

export async function deleteAccount(id: string, confirmName: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const { data: account, error: findErr } = await supabase
    .from("accounts")
    .select("id, plot_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findErr) return { error: findErr.message };
  if (!account) return { error: "That plot is already gone." };
  if (confirmName.trim() !== String(account.plot_name).trim()) return { error: "The name doesn’t match." };

  // trades + journal entries for this account cascade-delete (FK on delete cascade)
  const { error } = await supabase.from("accounts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePlot(id);
  revalidatePath("/journal");
  revalidatePath("/calendar");
  redirect("/accounts");
}
