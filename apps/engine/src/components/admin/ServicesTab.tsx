import { useState } from "react";
import { ServiceList } from "./ServiceList";
import { ServiceEditor } from "./ServiceEditor";

interface ServicesTabProps {
  services: any[];
  onChange: (services: any[]) => void;
}

export function ServicesTab({ services, onChange }: ServicesTabProps) {
  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);

  const handleCreate = () => {
    setSelectedService(null);
    setSelectedIndex(null);
    setView("create");
  };

  const handleEdit = (service: any, index: number) => {
    setSelectedService(service);
    setSelectedIndex(index);
    setView("edit");
  };

  const handleDelete = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    onChange(newServices);
  };

  const handleSave = (service: any) => {
    const newServices = [...services];
    if (view === "create") {
      newServices.push(service);
    } else if (selectedIndex !== null) {
      newServices[selectedIndex] = service;
    }
    onChange(newServices);
    setView("list");
    setSelectedService(null);
    setSelectedIndex(null);
  };

  const handleCancel = () => {
    setView("list");
    setSelectedService(null);
    setSelectedIndex(null);
  };

  if (view === "create" || view === "edit") {
    return (
      <ServiceEditor
        service={selectedService}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <ServiceList
      services={services}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
  );
}
