"use client";

import { useEffect, useState } from "react";
import { createCategory, listCategories, type Category } from "@/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data/data-table";

export function CategoriesClient() {
  const [rows, setRows] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function load() {
    const response = await listCategories();
    setRows(response);
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Category</Button>
          </DialogTrigger>
          <DialogContent title="Create Category">
            <div className="space-y-2">
              <Input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input placeholder="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
              <Button
                onClick={async () => {
                  await createCategory({ name, slug });
                  setName("");
                  setSlug("");
                  await load();
                }}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Name" },
          { key: "slug", header: "Slug" },
        ]}
      />
    </div>
  );
}
