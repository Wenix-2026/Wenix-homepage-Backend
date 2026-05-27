<?php
// src/Entity/Tenant.php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'tenants')]
class Tenant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100, unique: true)]
    private string $name;           // "Firma ABC"

    #[ORM\Column(length: 100, unique: true)]
    private string $slug;           // "firma-abc"

    #[ORM\Column(length: 100, unique: true)]
    private string $dbName;         // "tenant_firma_abc"

    #[ORM\Column(length: 255, unique: true)]
    private string $domain;         // "firma-abc.tvujeshop.cz"

    #[ORM\Column]
    private bool $active = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    // Gettery a settery
    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }
    public function getSlug(): string { return $this->slug; }
    public function setSlug(string $slug): static { $this->slug = $slug; return $this; }
    public function getDbName(): string { return $this->dbName; }
    public function setDbName(string $dbName): static { $this->dbName = $dbName; return $this; }
    public function getDomain(): string { return $this->domain; }
    public function setDomain(string $domain): static { $this->domain = $domain; return $this; }
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): static { $this->active = $active; return $this; }
}
